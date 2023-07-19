import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { classNames } from '../utils/ClassNames';
import DomHandler from '../utils/DomHandler';
import {TieredMenuSub} from './TieredMenuSub';
import { CSSTransition } from 'react-transition-group';
import UniqueComponentId from '../utils/UniqueComponentId';
import ConnectedOverlayScrollHandler from '../utils/ConnectedOverlayScrollHandler';

// interface IProps {
//     children(args: {direction: 'left' | 'right'}): JSX.Element;
// }

// interface IState {
//     direction: 'left' | 'right' | null;
// }

/**
 * Checks whether there is more space on the left or right,
 * in order to choose which direction submenus open to.
 */
export class LocationRetrieved extends React.PureComponent { // <IProps, IState>
    constructor(props) {
        super(props);

        this.state = {
            direction: null,
        };

        this.recompute = this.recompute.bind(this);
    }

    recompute(callback) { // public, used in TieredMenu#show
        this.setState({
            direction: null,
        });
        setTimeout(callback, 0);
    }

    render() {
        if (this.state.direction == null) {
            return (
                <span
                    ref={(el) => {
                        if (el != null) {
                            const rect = el.getBoundingClientRect();
                            const left = rect.left;
                            const availableSpaceH = document.body.offsetWidth;
                            const direction = left < availableSpaceH / 2 ? 'right' : 'left';

                            this.setState({direction});
                        }
                    }}
                />
            );
        } else {
            return this.props.children({
                direction: this.state.direction,
            });
        }
    }
}

export class TieredMenu extends Component {

    static defaultProps = {
        id: null,
        model: null,
        popup: false,
        style: null,
        className: null,
        autoZIndex: true,
        zIndex: 0,
        appendTo: null,
        onShow: null,
        onHide: null
    };

    static propTypes = {
        id: PropTypes.string,
        model: PropTypes.array,
        popup: PropTypes.bool,
        style: PropTypes.object,
        className: PropTypes.string,
        autoZIndex: PropTypes.bool,
        zIndex: PropTypes.number,
        appendTo: PropTypes.any,
        onShow: PropTypes.func,
        onHide: PropTypes.func,
        'data-test-id': PropTypes.string,
    };

    constructor(props) {
        super(props);

        this.state = {
            visible: !props.popup
        };

        this.onEnter = this.onEnter.bind(this);
        this.onEntered = this.onEntered.bind(this);
        this.onExit = this.onExit.bind(this);

        this.id = this.props.id || UniqueComponentId();
    }

    toggle(event) {
        if (this.props.popup) {
            if (this.state.visible)
                this.hide(event);
            else
                this.show(event);
        }
    }

    show(event) {
        this.target = event.currentTarget;
        let currentEvent = event;

        this.locator.recompute(() => {
            this.setState({ visible: true }, () => {
                if (this.props.onShow) {
                    this.props.onShow(currentEvent);
                }
            });
        });
    }

    hide(event) {
        let currentEvent = event;
        this.setState({ visible: false }, () => {
            if (this.props.onHide) {
                this.props.onHide(currentEvent);
            }
        });
    }

    onEnter() {
        if (this.props.autoZIndex) {
            this.container.style.zIndex = this.props.zIndex ?? 1000;
        }
        DomHandler.absolutePosition(this.container,  this.target);
    }

    onEntered() {
        this.bindDocumentListeners();
        this.bindScrollListener();
    }

    onExit() {
        this.target = null;
        this.unbindDocumentListeners();
        this.unbindScrollListener();
    }

    bindDocumentListeners() {
        this.bindDocumentClickListener();
        this.bindDocumentResizeListener();
    }

    unbindDocumentListeners() {
        this.unbindDocumentClickListener();
        this.unbindDocumentResizeListener();
    }

    bindDocumentClickListener() {
        if (!this.documentClickListener) {
            this.documentClickListener = (event) => {
                if (this.props.popup && this.state.visible && !this.container.contains(event.target)) {
                    this.hide(event);
                }
            };

            document.addEventListener('click', this.documentClickListener);
        }
    }

    unbindDocumentClickListener() {
        if (this.documentClickListener) {
            document.removeEventListener('click', this.documentClickListener);
            this.documentClickListener = null;
        }
    }

    bindDocumentResizeListener() {
        if (!this.documentResizeListener) {
            this.documentResizeListener = (event) => {
                if (this.state.visible) {
                    this.hide(event);
                }
            };

            window.addEventListener('resize', this.documentResizeListener);
        }
    }

    unbindDocumentResizeListener() {
        if(this.documentResizeListener) {
            window.removeEventListener('resize', this.documentResizeListener);
            this.documentResizeListener = null;
        }
    }

    bindScrollListener() {
        if (!this.scrollHandler) {
            this.scrollHandler = new ConnectedOverlayScrollHandler(this.target, (event) => {
                if (this.state.visible) {
                    this.hide(event);
                }
            });
        }

        this.scrollHandler.bindScrollListener();
    }

    unbindScrollListener() {
        if (this.scrollHandler) {
            this.scrollHandler.unbindScrollListener();
        }
    }

    componentWillUnmount() {
        this.unbindDocumentListeners();
        if (this.scrollHandler) {
            this.scrollHandler.destroy();
            this.scrollHandler = null;
        }
    }

    renderElement(direction) {
        const className = classNames('p-tieredmenu p-component', {'p-tieredmenu-overlay': this.props.popup}, this.props.className);

        return (
            <CSSTransition classNames="p-connected-overlay" in={this.state.visible} timeout={{ enter: 120, exit: 100 }}
                unmountOnExit onEnter={this.onEnter} onEntered={this.onEntered} onExit={this.onExit}>
                <div ref={el => this.container = el} id={this.id} className={className} style={this.props.style} data-test-id={this.props['data-test-id']}>
                    <TieredMenuSub model={this.props.model} root popup={this.props.popup} direction={direction} />
                </div>
            </CSSTransition>
        );
    }

    render() {
        return (
            <LocationRetrieved
                ref={(instance) => {
                    if (instance != null) {
                        this.locator = instance;
                    }
                }}
            >
                {({direction}) => {
                    const element = this.renderElement(direction);

                    if (this.props.appendTo)
                        return ReactDOM.createPortal(element, this.props.appendTo);
                    else
                        return element;
                }}
            </LocationRetrieved>
        );
    }
}
